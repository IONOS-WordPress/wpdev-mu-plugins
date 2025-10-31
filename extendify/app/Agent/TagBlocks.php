<?php

namespace Extendify\Agent;

defined('ABSPATH') || die('No direct access.');

class TagBlocks
{
    // Blocks to ignore completely (block + its children)
    private static $ignored = ['core/query', 'core/post-template', 'core/post-content'];

    public static function init()
    {
        \add_filter('the_content', [self::class, 'enterScope'], 0);
        \add_filter('the_content', [self::class, 'leaveScope'], PHP_INT_MAX);

        \add_filter('pre_render_block', [self::class, 'pre'], 10, 2);
        \add_filter('render_block', [self::class, 'post'], 10, 2);
    }

    public static function enterScope($content)
    {
        if (is_admin()) {
            return $content;
        }

        if (empty($GLOBALS['extendify_agent_scope'])) {
            $GLOBALS['extendify_agent_scope'] = [
                'depth'  => 0,
                'frames' => [],
            ];
        }
        $GLOBALS['extendify_agent_scope']['depth']++;
        // Each scope has: seq, id_stack, pushed_stack, skip_depth
        $GLOBALS['extendify_agent_scope']['frames'][] = [
            'seq'          => 0,
            'id_stack'     => [],
            'pushed_stack' => [],
            'skip_depth'   => 0, // >0 while inside an ignored subtree
        ];
        return $content;
    }

    public static function leaveScope($content)
    {
        if (is_admin()) {
            return $content;
        }
        $S =& $GLOBALS['extendify_agent_scope'];
        if (!empty($S['depth'])) {
            $S['depth']--;
            array_pop($S['frames']);
        }
        return $content;
    }

    public static function pre($pre, $parsed_block)
    {
        if (is_admin() || !is_array($parsed_block) || empty($parsed_block['blockName'])) {
            return $pre;
        }

        $S = $GLOBALS['extendify_agent_scope'] ?? null;
        if (!$S || ($S['depth'] ?? 0) !== 1 || empty($S['frames'])) {
            return $pre;
        } // only outer the_content

        $i = count($S['frames']) - 1;
        $frame = $S['frames'][$i];

        $name = $parsed_block['blockName'];

        // If this block starts an ignored subtree, enter skip mode
        if (in_array($name, self::$ignored, true)) {
            $frame['skip_depth']++;
            $frame['pushed_stack'][] = false; // we didn't assign an id to this block
        } elseif ($frame['skip_depth'] > 0) {
            // Already skipping? (we're inside an ignored subtree)
            $frame['pushed_stack'][] = false; // no id for anything under ignored
        } else {
            // Normal counting
            $frame['seq']++;
            $id = $frame['seq'];
            $frame['id_stack'][]     = $id;
            $frame['pushed_stack'][] = true;
        }

        $GLOBALS['extendify_agent_scope']['frames'][$i] = $frame;
        return $pre;
    }

    public static function post($content, $parsed_block)
    {
        $S = $GLOBALS['extendify_agent_scope'] ?? null;
        if (!$S || empty($S['frames'])) {
            return $content;
        }

        $i = count($S['frames']) - 1;
        $frame = $S['frames'][$i];

        $name = is_array($parsed_block) ? ($parsed_block['blockName'] ?? null) : null;

        // Pop pushed flag & optional id (ALWAYS pop to stay balanced)
        $pushed = !empty($frame['pushed_stack']) ? array_pop($frame['pushed_stack']) : false;
        $id     = ($pushed && !empty($frame['id_stack'])) ? array_pop($frame['id_stack']) : null;

        // Inject only when: outer scope, we counted this block, html present, not admin
        if (!is_admin() && ($S['depth'] ?? 0) === 1 && $pushed && $id && $content && $name) {
            $tp = new \WP_HTML_Tag_Processor($content);
            $value = (string) (int) $id;

            // Move cursor to the first start tag in the fragment
            if ($tp->next_tag()) {
                $tp->set_attribute('data-extendify-agent-block-id', $value);
                $content = $tp->get_updated_html();
            }
        }

        // If this block ends an ignored subtree, exit skip mode
        if ($name && in_array($name, self::$ignored, true) && $frame['skip_depth'] > 0) {
            $frame['skip_depth']--;
        }

        $GLOBALS['extendify_agent_scope']['frames'][$i] = $frame;
        return $content;
    }
}
